# Abshar Items Backend (Vercel-ready)

Express + MongoDB + Cloudinary backend.

## Deploy (Vercel)

1. Ye folder GitHub pe push karein (ya `vercel` CLI use karein).
2. Vercel Project → Settings → Environment Variables me ye 4 vars daalein:
   - `MONGO_URI`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
3. Redeploy karein.

## Images (6 total)

Har record me 6 images upload ho sakti hain (sab Cloudinary pe jaati hain):

| Field (FormData name)     | DB field                    |
|---------------------------|-----------------------------|
| `userImage`               | userImageUrl                |
| `cardImage`               | cardImageUrl                |
| `iqamaImage`              | iqamaImageUrl               |
| `qrCode1`                 | qrCode1Url                  |
| `drivingLicenseImage`     | drivingLicenseImageUrl      |
| `qrCode2`                 | qrCode2Url                  |

Vercel serverless pe disk nahi hoti, isliye `multer.memoryStorage()` use hota hai
(images sirf memory me aati hain aur seedha Cloudinary pe upload hoti hain —
kahin local disk pe write nahi hota). Vercel ka request body limit ~4.5 MB hai,
isliye frontend images ko client-side compress karke bhejta hai.
