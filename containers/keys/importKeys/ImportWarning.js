import { c } from 'ttag';
import React from 'react';
import { Alert } from 'react-components';

const ImportWarning = () => {
    return (
        <Alert>
            {c('Alert').t`Are you sure you want to import a private key? Importing an insecurely generated or leaked private key can harm the security of your emails.`}
        </Alert>
    );
};

ImportWarning.propTypes = {
};

export default ImportWarning;
