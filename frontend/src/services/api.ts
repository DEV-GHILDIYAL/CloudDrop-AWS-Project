import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';

// Replace this with your actual API Gateway endpoint once deployed
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to add auth token
api.interceptors.request.use(
    async (config) => {
        try {
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken?.toString();

            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.warn('No active auth session found', error);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export const FileService = {
    getFiles: () => api.get('/files').then((res) => res.data),

    getUploadUrl: (data: { fileName: string; fileType: string; fileSize: number }) =>
        api.post('/upload-url', data).then((res) => res.data),

    saveFileMetadata: (data: { fileId: string; fileName: string; s3Key: string; fileSize: number; fileType: string }) =>
        api.post('/file', data).then((res) => res.data),

    deleteFile: (userId: string, fileId: string) =>
        api.delete(`/file/${userId}/${fileId}`).then((res) => res.data),

    getDownloadUrl: (userId: string, fileId: string) =>
        api.get(`/download/${userId}/${fileId}`).then((res) => res.data),
};
