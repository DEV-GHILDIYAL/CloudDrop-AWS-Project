'use client';

import React, { useEffect, useState } from 'react';
import FileUploader from '@/components/FileUploader';
import FileList, { FileData } from '@/components/FileList';
import { FileService } from '@/services/api';
import { HardDrive, Upload, Download, LogOut, Loader2 } from 'lucide-react';
import { formatBytes } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { fetchAuthSession, getCurrentUser, signOut } from 'aws-amplify/auth';
import Image from 'next/image';

export default function Dashboard() {
    const router = useRouter();
    const [files, setFiles] = useState<FileData[]>([]);
    const [analytics, setAnalytics] = useState({ totalUploads: 0, totalDownloads: 0, storageUsed: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [userId, setUserId] = useState<string>('');

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const data = await FileService.getFiles();
            setFiles(data.files || []);
            setAnalytics(data.analytics || { totalUploads: 0, totalDownloads: 0, storageUsed: 0 });
        } catch (err: any) {
            console.error('Error fetching dashboard data:', err);
            // If we get an error, it is likely Auth related or Network error, we can blank the files
            setFiles([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const session = await fetchAuthSession();
                if (!session.tokens) {
                    router.push('/');
                    return;
                }
                const user = await getCurrentUser();
                setUserId(user.userId);

                // Only fetch data after confirming auth
                fetchDashboardData();
            } catch (err) {
                console.warn('No active session, redirecting to login.', err);
                router.push('/');
            }
        };

        checkAuth();
    }, [router]);

    const handleLogout = async () => {
        try {
            await signOut();
            router.push('/');
        } catch (error) {
            console.error('Error signing out', error);
        }
    };

    if (loading || !userId) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
                {/* Navbar Skeleton */}
                <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 flex items-center px-4 sm:px-6 lg:px-8">
                    <div className="w-32 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="ml-auto w-20 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </nav>

                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                    {/* Analytics Skeletons */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex items-center">
                                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg mr-4 animate-pulse"></div>
                                <div className="space-y-2">
                                    <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                    <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Uploader Skeleton */}
                    <div className="mb-12">
                        <div className="w-36 h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse"></div>
                        <div className="w-full max-w-xl mx-auto h-48 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
                    </div>

                    {/* File List Skeletons */}
                    <div>
                        <div className="w-24 h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 h-40 animate-pulse flex flex-col justify-between">
                                    <div className="flex justify-between items-start">
                                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                                        <div className="w-24 h-8 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                                    </div>
                                    <div className="space-y-2 mt-4">
                                        <div className="w-3/4 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                        <div className="w-1/2 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
            {/* Navigation */}
            <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <Image src="/Logo.png" alt="CloudDrop Logo" width={36} height={36} className="object-contain mr-3 drop-shadow-sm" />
                            <span className="font-bold text-xl text-gray-900 dark:text-white tracking-tight">CloudDrop</span>
                        </div>
                        <div className="flex items-center">
                            <button
                                onClick={handleLogout}
                                className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                <LogOut className="w-5 h-5 mr-1" />
                                <span className="text-sm font-medium">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                {/* Analytics Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex items-center">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg mr-4">
                            <Upload className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Uploads</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.totalUploads || files.length}</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex items-center">
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-lg mr-4">
                            <Download className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Downloads</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {analytics.totalDownloads || files.reduce((acc, f) => acc + (f.downloadCount || 0), 0)}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex items-center">
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg mr-4">
                            <HardDrive className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Storage Used</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {formatBytes(analytics.storageUsed || files.reduce((acc, f) => acc + f.fileSize, 0))}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Upload Section */}
                <div className="mb-12">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upload New File</h2>
                    <FileUploader onUploadSuccess={fetchDashboardData} />
                </div>

                {/* File List Section */}
                <div>
                    <div className="flex justify-between items-end mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Files</h2>
                        <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                            {files.length} items
                        </span>
                    </div>

                    <FileList
                        files={files}
                        userId={userId}
                        onFileDeleted={fetchDashboardData}
                    />
                </div>
            </main>
        </div>
    );
}
