import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Modal, ContentDivModal, Row } from 'react-components';

const GeneratingModal = ({ title, generate, onClose, onSuccess }) => {
    useEffect(() => {
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
