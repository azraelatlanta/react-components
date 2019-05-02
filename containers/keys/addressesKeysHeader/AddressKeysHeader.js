import React from 'react';
import { c } from 'ttag';
import { SubTitle, Alert } from 'react-components';

const AddressKeysHeader = () => {
    const title = c('Title').t`Email Encryption Keys`;

    return (
        <>
            <SubTitle>{title}</SubTitle>
            <Alert learnMore="todo">
                {c('Info')
                    .t`Download your PGP Keys for use with other PGP compatible services. Only incoming messages in inline OpenPGP format are currently supported.`}
            </Alert>
        </>
    );
};

AddressKeysHeader.propTypes = {
};

export default AddressKeysHeader;
