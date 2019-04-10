import SelectAddressModal from '../modals/SelectAddressModal';
import ImportKeyModal from '../modals/ImportKeyModal';
import { c } from 'ttag';
import React from 'react';

const handleImportKey = async ({ Addresses, }, { createNotification, createPrompt }) => {
    // eslint-disable-next-line
    console.log('import key', ...args);

    if (Addresses.length === 0) {
        throw new Error('No addresses to add a key to');
    }

    const address = Addresses.length === 1 ? Addresses[0] :
        await createPrompt((resolve, reject) => {
            return (
                <SelectAddressModal
                    Addresses={Addresses}
                    onClose={reject}
                    onSuccess={resolve}
                />
            );
        });

    const decryptedKeys = await createPrompt((resolve, reject) => {
        return (
            <ImportKeyModal
                onClose={reject}
                onSuccess={resolve}
            />
        );
    });

    console.log(decryptedKeys);

    createNotification({
        text: c('Success').t`Private keys imported`,
        type: 'success'
    });
};
