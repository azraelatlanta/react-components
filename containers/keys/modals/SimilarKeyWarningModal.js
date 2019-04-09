import { c } from 'ttag';
import React from 'react';
import PropTypes from 'prop-types';
import { ConfirmModal, Alert } from 'react-components';

const SimilarKeyWarningModal = ({ onSuccess, onClose }) => {
    const texts = {
        title: c('Title').t`Similar key already active`,
        confirm: c('Action').t`Continue`,
        cancel: c('Action').t`Cancel`
    };
    return (
        <ConfirmModal
            show={true}
            onClose={onClose}
            onConfirm={onSuccess}
            {...texts}
        >
            <Alert>
                {c('Info').t`A key with the same encryption algorithm is already active for this address. Generating another key will cause slower account loading and deletion of this key can cause issues. If you are generating a new key because your old key is compromised, please mark that key as compromised. Are you sure you want to continue?`}
            </Alert>
        </ConfirmModal>
    );
};

SimilarKeyWarningModal.propTypes = {
    onSuccess: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired
};

export default SimilarKeyWarningModal;
