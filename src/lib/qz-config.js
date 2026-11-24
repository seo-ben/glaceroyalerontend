import apiClient from '@/api/client';

/**
 * Configuration de la sécurité QZ Tray pour l'impression silencieuse
 */
export const initQzSecurity = () => {
    // qz est chargé via CDN dans index.html, il est sur l'objet window
    const qz = window.qz;
    if (!qz || !qz.security) {
        return false;
    }

    // Définir l'algorithme SHA1 pour correspondre à OPENSSL_ALGO_SHA1 du backend
    if (typeof qz.security.setSignatureAlgorithm === 'function') {
        qz.security.setSignatureAlgorithm("SHA1");
    }

    // Chargement du certificat public depuis le serveur
    qz.security.setCertificatePromise((resolve, reject) => {
        apiClient.get('/qz/certificate')
            .then(res => resolve(res.data))
            .catch(err => {
                console.error("Erreur chargement certificat QZ:", err);
                reject(err);
            });
    });

    // Signature des requêtes d'impression par le serveur (clé privée)
    qz.security.setSignaturePromise((toSign) => {
        return (resolve, reject) => {
            apiClient.post('/qz/sign', { request: toSign })
                .then(res => resolve(res.data))
                .catch(err => {
                    console.error("Erreur signature QZ:", err);
                    reject(err);
                });
        };
    });

    return true;
};
