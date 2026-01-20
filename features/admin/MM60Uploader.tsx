import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, Loader, Database, Calendar } from 'lucide-react';
import { uploadMM60File } from '../../src/core/firebase';
import { saveMM60Metadata, saveMM60DataChunks } from '../../src/core/firebase/mm60-service';
// @ts-ignore - XLSX types not fully compatible
import * as XLSX from 'xlsx';
import { useUser } from '../users/UserContext';

interface UploadStatus {
    status: 'idle' | 'uploading' | 'success' | 'error';
    progress: number;
    message: string;
    fileName?: string;
    uploadedAt?: string;
}

export const MM60Uploader: React.FC = () => {
    const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
        status: 'idle',
        progress: 0,
        message: ''
    });
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { currentUser } = useUser();

    // Validate file
    const validateFile = (file: File): { valid: boolean; error?: string } => {
        // Check file type
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel' // .xls
        ];

        if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
            return { valid: false, error: 'File harus berformat Excel (.xlsx atau .xls)' };
        }

        // Check file size (max 50MB)
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
            return { valid: false, error: 'Ukuran file maksimal 50MB' };
        }

        // Check file name contains MM60
        if (!file.name.toLowerCase().includes('mm60')) {
            return { valid: false, error: 'Nama file harus mengandung "MM60"' };
        }

        return { valid: true };
    };

    // Handle file upload
    const handleFileUpload = async (file: File) => {
        // Validate file
        const validation = validateFile(file);
        if (!validation.valid) {
            setUploadStatus({
                status: 'error',
                progress: 0,
                message: validation.error || 'File tidak valid'
            });
            return;
        }

        try {
            // Step 1: Upload to Firebase Cloud Storage
            setUploadStatus({
                status: 'uploading',
                progress: 20,
                message: 'Mengupload file ke cloud...',
                fileName: file.name
            });

            await uploadMM60File(file);

            // Step 2: Parse Excel file
            setUploadStatus({
                status: 'uploading',
                progress: 40,
                message: 'Membaca data Excel...',
                fileName: file.name
            });

            const parsedData = await parseExcelFile(file);

            // Step 3: Save metadata to Firestore
            setUploadStatus({
                status: 'uploading',
                progress: 60,
                message: 'Menyimpan metadata...',
                fileName: file.name
            });

            const metadataId = await saveMM60Metadata({
                fileName: file.name,
                uploadedAt: Date.now(),
                uploadedBy: currentUser?.name || 'Admin',
                rowCount: parsedData.data.length,
                headers: parsedData.headers,
                lastModified: Date.now()
            });

            // Step 4: Save data chunks to Firestore
            setUploadStatus({
                status: 'uploading',
                progress: 80,
                message: `Menyinkronkan ${parsedData.data.length} baris data...`,
                fileName: file.name
            });

            await saveMM60DataChunks(metadataId, parsedData.data);

            // Success
            setUploadStatus({
                status: 'success',
                progress: 100,
                message: `Data berhasil disinkronkan! ${parsedData.data.length} baris tersedia untuk semua user.`,
                fileName: file.name,
                uploadedAt: new Date().toLocaleString('id-ID')
            });

            console.log('[MM60Uploader] Upload complete:', {
                metadataId,
                fileName: file.name,
                rows: parsedData.data.length,
                headers: parsedData.headers
            });

            // Auto reset after 5 seconds
            setTimeout(() => {
                setUploadStatus({
                    status: 'idle',
                    progress: 0,
                    message: ''
                });
            }, 5000);

        } catch (error) {
            console.error('[MM60Uploader] Upload error:', error);
            setUploadStatus({
                status: 'error',
                progress: 0,
                message: error instanceof Error ? error.message : 'Gagal mengupload dan menyinkronkan data'
            });
        }
    };

    // Parse Excel file
    const parseExcelFile = async (file: File): Promise<{ headers: string[]; data: any[] }> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = e.target?.result;
                    const workbook = XLSX.read(data, { type: 'binary' });
                    const sheetName = workbook.SheetNames[0];
                    if (!sheetName) {
                        reject(new Error('File Excel tidak memiliki sheet'));
                        return;
                    }
                    const worksheet = workbook.Sheets[sheetName];
                    if (!worksheet) {
                        reject(new Error('Sheet Excel tidak dapat dibaca'));
                        return;
                    }
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

                    if (jsonData.length === 0) {
                        reject(new Error('File Excel kosong'));
                        return;
                    }

                    // First row is headers
                    const firstRow = jsonData[0];
                    if (!firstRow || firstRow.length === 0) {
                        reject(new Error('File Excel tidak memiliki header'));
                        return;
                    }
                    const headers = firstRow.map(h => String(h || ''));

                    // Rest are data rows
                    const rows = jsonData.slice(1).map(row => {
                        const obj: any = {};
                        headers.forEach((header, index) => {
                            obj[header] = row[index] !== undefined ? row[index] : '';
                        });
                        return obj;
                    });

                    console.log('[MM60Uploader] Excel parsed:', {
                        headers: headers.length,
                        rows: rows.length
                    });

                    resolve({ headers, data: rows });
                } catch (error) {
                    reject(new Error('Gagal membaca file Excel'));
                }
            };

            reader.onerror = () => {
                reject(new Error('Gagal membaca file'));
            };

            reader.readAsBinaryString(file);
        });
    };

    // Handle drag events
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0]) {
            handleFileUpload(files[0]);
        }
    };

    // Handle file input change
    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0 && files[0]) {
            handleFileUpload(files[0]);
        }
    };

    // Trigger file input click
    const handleBrowseClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-semibold text-slate-800">MM60 Data Management</h2>
            </div>

            {/* Upload Area */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-all
          ${isDragging
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/50'
                    }
          ${uploadStatus.status === 'uploading' ? 'pointer-events-none opacity-60' : 'cursor-pointer'}
        `}
                onClick={uploadStatus.status !== 'uploading' ? handleBrowseClick : undefined}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileInputChange}
                    className="hidden"
                    disabled={uploadStatus.status === 'uploading'}
                />

                {/* Upload Icon */}
                <div className="flex justify-center mb-4">
                    {uploadStatus.status === 'uploading' ? (
                        <Loader className="w-12 h-12 text-indigo-600 animate-spin" />
                    ) : uploadStatus.status === 'success' ? (
                        <CheckCircle className="w-12 h-12 text-green-600" />
                    ) : uploadStatus.status === 'error' ? (
                        <XCircle className="w-12 h-12 text-red-600" />
                    ) : (
                        <Upload className="w-12 h-12 text-slate-400" />
                    )}
                </div>

                {/* Status Message */}
                <div className="space-y-2">
                    {uploadStatus.status === 'idle' && (
                        <>
                            <p className="text-lg font-medium text-slate-700">
                                Drag & Drop MM60 Excel File
                            </p>
                            <p className="text-sm text-slate-500">
                                atau klik untuk browse file
                            </p>
                            <p className="text-xs text-slate-400 mt-2">
                                Format: .xlsx atau .xls (Max 50MB)
                            </p>
                        </>
                    )}

                    {uploadStatus.status === 'uploading' && (
                        <>
                            <p className="text-lg font-medium text-indigo-700">
                                Uploading {uploadStatus.fileName}...
                            </p>
                            <div className="w-full max-w-md mx-auto mt-4">
                                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-indigo-600 transition-all duration-300"
                                        style={{ width: `${uploadStatus.progress}%` }}
                                    />
                                </div>
                                <p className="text-sm text-slate-600 mt-2">
                                    {uploadStatus.progress}%
                                </p>
                            </div>
                        </>
                    )}

                    {uploadStatus.status === 'success' && (
                        <>
                            <p className="text-lg font-medium text-green-700">
                                ✓ {uploadStatus.message}
                            </p>
                            <p className="text-sm text-slate-600">
                                {uploadStatus.fileName}
                            </p>
                            <p className="text-xs text-slate-400">
                                Uploaded: {uploadStatus.uploadedAt}
                            </p>
                        </>
                    )}

                    {uploadStatus.status === 'error' && (
                        <>
                            <p className="text-lg font-medium text-red-700">
                                ✗ {uploadStatus.message}
                            </p>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setUploadStatus({ status: 'idle', progress: 0, message: '' });
                                }}
                                className="mt-2 text-sm text-indigo-600 hover:text-indigo-700 underline"
                            >
                                Try Again
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Info Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <FileSpreadsheet className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                    <div className="space-y-2 text-sm">
                        <p className="font-medium text-blue-900">Panduan Upload MM60:</p>
                        <ul className="list-disc list-inside text-blue-800 space-y-1">
                            <li>File harus berformat Excel (.xlsx atau .xls)</li>
                            <li>Nama file harus mengandung "MM60"</li>
                            <li>Ukuran maksimal 50MB</li>
                            <li>Data akan otomatis tersedia untuk semua user</li>
                            <li>Upload dilakukan 1x per bulan atau saat ada update</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Version History (placeholder for future) */}
            <div className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-slate-600" />
                    <h3 className="text-sm font-semibold text-slate-700">Upload History</h3>
                </div>
                <p className="text-sm text-slate-500 italic">
                    History akan ditampilkan setelah ada upload pertama
                </p>
            </div>
        </div>
    );
};
