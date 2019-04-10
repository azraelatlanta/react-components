import { generateUID } from '../../../helpers/component';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import React from 'react';
import { Alert, Modal, ContentDivModal, FooterModal, ResetButton, PrimaryButton } from 'react-components';

const ImportWarningModal = ({ onClose, onSuccess }) => {
    const title = c('Title').t`Import key`;
    const notificationText = c('Alert').t`Are you sure you want to import a private key? Importing an insecurely generated or leaked private key can harm the security of your emails.`;

    return (
        <Modal show={true} onClose={onClose} title={title} type='small'>
            <ContentDivModal>
                <Alert>{notificationText}</Alert>
                <FooterModal>
                    <ResetButton onClick={onClose}>{c('Label').t`Cancel`}</ResetButton>
                    <PrimaryButton onClick={onSuccess}>{c('Label').t`Confirm`}</PrimaryButton>
                </FooterModal>
            </ContentDivModal>
        </Modal>
    );
};

ImportWarningModal.propTypes = {
    onSuccess: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
};

export default ImportWarningModal;
