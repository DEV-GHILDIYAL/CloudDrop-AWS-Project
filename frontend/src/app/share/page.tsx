'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { FileService } from '@/services/api';
import { Download, FileIcon, Loader2, AlertCircle, UploadCloud } from 'lucide-react';
import { formatBytes } from '@/lib/utils';
import Link from 'next/link';
import { FileData } from '@/components/FileList';

function SharePageContent() {
    const searchParams = useSearchParams();
    const userId = searchParams.get('userId');
    const fileId = searchParams.get('fileId');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [fileMeta, setFileMeta] = useState<FileData | null>(null);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!userId || !fileId) return;

        const fetchDownloadData = async () => {
            try {
                setLoading(true);
                const data = await FileService.getDownloadUrl(userId, fileId);
                setFileMeta(data.fileMeta);
                setDownloadUrl(data.downloadUrl);
            } catch (err: any) {
                console.error('Failed to load shared file:', err);
                setError(err?.response?.data?.error || 'File not found or link has expired.');
            } finally {
                setLoading(false);
            }
        };

        fetchDownloadData();
    }, [userId, fileId]);

    if (!userId || !fileId) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
                <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden p-8 text-center border border-gray-100 dark:border-gray-700">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Invalid Link</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8">This share link is missing required parameters.</p>
                    <Link
                        href="/"
                        className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Go to CloudDrop
                    </Link>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Loading your file...</p>
            </div>
        );
    }

    if (error || !fileMeta || !downloadUrl) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
                <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden p-8 text-center border border-gray-100 dark:border-gray-700">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Unavailable</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8">{error}</p>
                    <Link
                        href="/"
                        className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Go to CloudDrop
                    </Link>
                </div>
            </div>
        );
    }

    const handleDownload = () => {
        window.location.href = downloadUrl;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex flex-col p-4 relative">
            <header className="absolute top-0 left-0 right-0 p-6 flex justify-center sm:justify-start">
                <Link href="/" className="flex items-center text-gray-900 dark:text-white hover:opacity-80 transition-opacity">
                    <UploadCloud className="w-6 h-6 text-blue-600 mr-2" />
                    <span className="font-bold text-xl">CloudDrop</span>
                </Link>
            </header>

            <div className="flex-1 flex items-center justify-center">
                <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-8 pb-6 text-center border-b border-gray-100 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider">
                            Shared with you
                        </p>
                        <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm border border-blue-100 dark:border-blue-800/50">
                            <FileIcon className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate mb-1 px-4" title={fileMeta.fileName}>
                            {fileMeta.fileName}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                            {formatBytes(fileMeta.fileSize)}
                        </p>
                    </div>

                    <div className="p-6 bg-gray-50 dark:bg-gray-900/50">
                        <button
                            onClick={handleDownload}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl shadow-md hover:shadow-lg flex items-center justify-center gap-3 transition-all transform hover:-translate-y-0.5"
                        >
                            <Download className="w-5 h-5" />
                            Download File
                        </button>
                        <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-4">
                            Downloaded {fileMeta.downloadCount + 1} times
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function SharePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Loading...</p>
            </div>
        }>
            <SharePageContent />
        </Suspense>
    );
}
