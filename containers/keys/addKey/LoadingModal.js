import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Modal, FooterModal, ResetButton, ContentDivModal, Row } from 'react-components';
import { c } from 'ttag';

const LoadingModal = ({ title, onClose }) => {
    return (
        <Modal show={true} onClose={onClose} title={title} type="small">
            <ContentDivModal>
                <Row>
                    Loading...
                </Row>
                <FooterModal>
                    <ResetButton onClick={onClose}>{c('Label').t`Cancel`}</ResetButton>
                </FooterModal>
            </ContentDivModal>
        </Modal>
    );
};

LoadingModal.propTypes = {
    onClose: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
    delay: PropTypes.number
};

export default LoadingModal;
