'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File as FileIcon, X, CheckCircle } from 'lucide-react';
import { cn, formatBytes } from '@/lib/utils';
import { FileService } from '@/services/api';
import axios from 'axios';
import { toast } from 'sonner';

interface FileUploaderProps {
    onUploadSuccess: () => void;
}

export default function FileUploader({ onUploadSuccess }: FileUploaderProps) {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            setProgress(0);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxSize: 100 * 1024 * 1024, // 100MB
        multiple: false,
        onDropRejected: (rejections) => {
            const { errors } = rejections[0];
            if (errors[0].code === 'file-too-large') {
                toast.error('File is larger than 100MB max limit.');
            } else {
                toast.error(errors[0].message);
            }
        }
    });

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setProgress(0);

        try {
            // 1. Get presigned URL
            const { uploadUrl, fileId, s3Key } = await FileService.getUploadUrl({
                fileName: file.name,
                fileType: file.type || 'application/octet-stream',
                fileSize: file.size,
            });

            // 2. Upload to S3 directly
            await axios.put(uploadUrl, file, {
                headers: {
                    'Content-Type': file.type,
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = progressEvent.total
                        ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
                        : 0;
                    setProgress(percentCompleted);
                },
            });

            // 3. Save Metadata
            await FileService.saveFileMetadata({
                fileId,
                fileName: file.name,
                s3Key,
                fileSize: file.size,
                fileType: file.type || 'application/octet-stream',
            });

            toast.success('File uploaded successfully!');
            setFile(null);
            onUploadSuccess();
        } catch (err: any) {
            console.error('Upload failed', err);
            toast.error(err?.response?.data?.error || 'Failed to upload file. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="w-full max-w-xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            {!file ? (
                <div
                    {...getRootProps()}
                    className={cn(
                        "border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center cursor-pointer transition-colors duration-200",
                        isDragActive ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-300 hover:border-blue-400 dark:border-gray-600 dark:hover:border-blue-500"
                    )}
                >
                    <input {...getInputProps()} />
                    <div className="bg-blue-100 dark:bg-blue-900/40 p-3 rounded-full mb-4">
                        <UploadCloud className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-gray-700 dark:text-gray-200 font-medium text-lg mb-1">
                        {isDragActive ? "Drop your file here..." : "Drag & drop a file here"}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        or click to select file
                    </p>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                        Max file size: 100MB
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700 relative">
                        <FileIcon className="w-10 h-10 text-blue-500 flex-shrink-0 mr-4" />
                        <div className="flex-1 min-w-0 pr-8">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {file.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatBytes(file.size)}
                            </p>
                        </div>
                        {!uploading && (
                            <button
                                onClick={() => setFile(null)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                                aria-label="Remove file"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    {uploading && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-300">Uploading...</span>
                                <span className="font-medium">{progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={() => setFile(null)}
                            disabled={uploading}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 w-full disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleUpload}
                            disabled={uploading}
                            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 w-full disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {uploading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Uploading
                                </>
                            ) : (
                                'Upload File'
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
