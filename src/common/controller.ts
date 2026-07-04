import { getSignedUploadUrl } from "../lib/s3";
import { v4 as uuidv4 } from "uuid";
import * as crypto from "crypto";
(global as any).crypto = crypto;

export const getUploadUrl = async (event: any) => {
    const filename = event.queryStringParameters?.filename || "image.jpg";
    const key = `donations/${uuidv4()}-${filename}`;
    const url = await getSignedUploadUrl(key);
    
    return {
        statusCode: 200,
        body: JSON.stringify({ uploadUrl: url, imageKey: key })
    };
};