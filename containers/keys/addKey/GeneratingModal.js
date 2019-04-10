import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Modal, FooterModal, ResetButton, ContentDivModal, Row } from 'react-components';
import { c } from 'ttag';

const GeneratingModal = ({ title, generate, onClose, onSuccess }) => {
    console.log('in gm')
    useEffect(() => {
        console.log('in use ef')
        generate()
            .then(onSuccess)
            .catch((e) => {
                console.error(e);
                onClose()
            });
    }, []);

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

GeneratingModal.propTypes = {
    onSuccess: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    generate: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired
};

export default GeneratingModal;
