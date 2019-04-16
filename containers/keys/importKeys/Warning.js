import { c } from 'ttag';
import React from 'react';
import { Alert } from 'react-components';

const Warning = () => {
    return (
        <Alert>
            {c('Alert').t`Are you sure you want to import a private key? Importing an insecurely generated or leaked private key can harm the security of your emails.`}
        </Alert>
    );
};

Warning.propTypes = {
};

export default Warning;
