import { c } from 'ttag';
import React from 'react';
import { Alert } from 'react-components';

const SimilarKeyWarning = () => {
    return (
        <Alert>
            {c('Info').t`A key with the same encryption algorithm is already active for this address. Generating another key will cause slower account loading and deletion of this key can cause issues. If you are generating a new key because your old key is compromised, please mark that key as compromised. Are you sure you want to continue?`}
        </Alert>
    );
};

SimilarKeyWarning.propTypes = {
};

export default SimilarKeyWarning;
