'use client';

import React, { useState } from 'react';
import { formatBytes } from '@/lib/utils';
import { FileService } from '@/services/api';
import { FileIcon, Trash2, Share2, Download, Clock } from 'lucide-react';
import ShareModal from './ShareModal';
import { toast } from 'sonner';

export interface FileData {
    fileId: string;
    userId: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    createdAt: string;
    expiresAt: number;
    downloadCount: number;
}

interface FileListProps {
    files: FileData[];
    onFileDeleted: () => void;
    userId: string;
}

export default function FileList({ files, onFileDeleted, userId }: FileListProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [shareData, setShareData] = useState<{ isOpen: boolean; fileName: string; url: string }>({
        isOpen: false,
        fileName: '',
        url: ''
    });

    const handleDelete = async (fileId: string) => {
        if (!confirm('Are you sure you want to delete this file?')) return;

        setDeletingId(fileId);
        try {
            await FileService.deleteFile(userId, fileId);
            toast.success('File deleted successfully');
            onFileDeleted();
        } catch (err) {
            console.error('Failed to delete file', err);
            toast.error('Failed to delete file. Please try again.');
        } finally {
            setDeletingId(null);
        }
    };

    const handleShare = async (file: FileData) => {
        try {
            // Create shareable app URL (this Next.js app)
            const shareUrl = `${window.location.origin}/share?userId=${file.userId}&fileId=${file.fileId}`;
            setShareData({
                isOpen: true,
                fileName: file.fileName,
                url: shareUrl
            });
        } catch (err) {
            console.error('Failed to generate share link', err);
            toast.error('Failed to create share link.');
        }
    };

    const handleDownloadOriginal = async (file: FileData) => {
        try {
            const { downloadUrl } = await FileService.getDownloadUrl(file.userId, file.fileId);
            // Trigger download
            window.location.href = downloadUrl;
        } catch (error) {
            console.error('Failed to download file directly', error);
            toast.error('Failed to download file directly.');
        }
    };

    if (files.length === 0) {
        return (
            <div className="text-center py-12 px-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No files yet</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                    Upload a file above to get started. Files will auto-delete after 30 days.
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {files.map((file) => {
                    const isDeleting = deletingId === file.fileId;
                    const daysToExpiry = Math.ceil((file.expiresAt * 1000 - Date.now()) / (1000 * 60 * 60 * 24));

                    return (
                        <div
                            key={file.fileId}
                            className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 transition-all duration-200 hover:shadow-md ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center shrink-0">
                                    <FileIcon className="w-6 h-6 text-blue-500" />
                                </div>
                                <div className="flex gap-1 bg-gray-50 dark:bg-gray-900 rounded-lg p-1 border border-gray-100 dark:border-gray-800">
                                    <button
                                        onClick={() => handleDownloadOriginal(file)}
                                        title="Download"
                                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-white dark:hover:bg-gray-800 rounded-md transition-colors"
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleShare(file)}
                                        title="Share"
                                        className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-white dark:hover:bg-gray-800 rounded-md transition-colors"
                                    >
                                        <Share2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(file.fileId)}
                                        title="Delete"
                                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-white dark:hover:bg-gray-800 rounded-md transition-colors"
                                    >
                                        {isDeleting ? (
                                            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <Trash2 className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="min-w-0">
                                <h4 className="text-base font-semibold text-gray-900 dark:text-white truncate mb-1" title={file.fileName}>
                                    {file.fileName}
                                </h4>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                                    <span>{formatBytes(file.fileSize)}</span>
                                    <span>•</span>
                                    <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                        <Download className="w-3 h-3" /> {file.downloadCount}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs">
                                <div className={`flex items-center gap-1 ${daysToExpiry < 7 ? 'text-amber-500' : 'text-gray-500 dark:text-gray-400'}`}>
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>Expires in {Math.max(0, daysToExpiry)} days</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <ShareModal
                isOpen={shareData.isOpen}
                onClose={() => setShareData(prev => ({ ...prev, isOpen: false }))}
                fileName={shareData.fileName}
                downloadUrl={shareData.url}
            />
        </>
    );
}
