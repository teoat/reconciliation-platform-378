// Types re-export for consumers expecting types.ts
export type LoginRequest = {
    email?: string;
    password?: string;
    [key: string]: any;
};

export type RegisterRequest = {
    email?: string;
    password?: string;
    [key: string]: any;
};

export type FileUploadRequest = {
    project_id: string;
    name: string;
    source_type: string;
    [key: string]: any;
};
