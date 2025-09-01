import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand} from "@aws-sdk/client-s3";

export const s3Client = new S3Client({
    region: process.env.BUCKET_REGION,
    credentials: {
        accessKeyId: process.env.ACCESS_KEY,
        secretAccessKey: process.env.SECRET_ACCESS_KEY,
    },
});

export const uploadFile = async (file) => {
    const command = new PutObjectCommand({ 
        Bucket: process.env.BUCKET_NAME,
        Key: file.originalname,
        Body: file.buffer,
        ContentType: file.mimetype,
    });

    const response = await s3Client.send(command);
    return response;    
};

export const deleteFile = async (fileKey) => {
    const command = new DeleteObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: fileKey,
    });

    const response = await s3Client.send(command);
    return response;    
};

export const getFile = async (fileKey) => {
    const command = new GetObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: fileKey,
    })

    const response = await s3Client.send(command);
    return response;    
};