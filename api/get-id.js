import { get } from 'https';
import { URL } from 'url';

export default function handler(request, response) {
    if (request.method === 'OPTIONS') {
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Access-Control-Allow-Methods', 'POST');
        response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return response.status(200).end();
    }

    response.setHeader('Access-Control-Allow-Origin', '*');

    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Only POST requests are allowed' });
    }

    const { url: shareUrl } = request.body;
    if (!shareUrl) {
        return response.status(400).json({ success: false, message: 'URL is required.' });
    }

    const req = get(shareUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
        if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
            try {
                const finalUrl = res.headers.location;
                const urlObject = new URL(finalUrl);
                const goodsId = urlObject.searchParams.get('goods_id');
                if (goodsId) {
                    response.status(200).json({ success: true, goods_id: goodsId });
                } else {
                    response.status(404).json({ success: false, message: 'Goods ID not found in the final URL.' });
                }
            } catch (e) {
                response.status(500).json({ success: false, message: 'Error parsing the final URL.' });
            }
        } else {
            response.status(400).json({ success: false, message: 'Link did not redirect as expected.' });
        }
    });

    req.on('error', (e) => {
        response.status(500).json({ success: false, message: 'Failed to fetch the URL.' });
    });
}
