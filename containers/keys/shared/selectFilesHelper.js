import { keyInfo as getKeyInfo, getKeys } from 'pmcrypto';
import { readFileAsString } from 'proton-shared/lib/helpers/fileHelper';
import { parseArmoredKeys } from 'proton-shared/lib/keys/keyImport';

export const parseKeys = async (files = []) => {
    const filesAsStrings = await Promise.all(files.map(readFileAsString)).catch(() => []);

    const armoredKeys = parseArmoredKeys(filesAsStrings.join('\n'));
    if (!armoredKeys.length) {
        return [];
    }

    return Promise.all(armoredKeys.map(async (armoredKey) => {
        const keyInfo = await getKeyInfo(armoredKey);
        const { decrypted } = keyInfo;
        return {
            info: keyInfo,
            armoredKey,
            decryptedPrivateKey: decrypted ? await getKeys(armoredKey) : undefined
        }
    }));
};
