import { getSignedDownloadUrl } from "../lib/s3";

export const attachImageUrls = async (items: any[]) => {
    return await Promise.all(items.map(async (item) => {
        if (item.imageKey) {
            item.imageUrl = await getSignedDownloadUrl(item.imageKey);
        }
        return item;
    }));
};