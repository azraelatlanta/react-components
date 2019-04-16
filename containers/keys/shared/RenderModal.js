import PropTypes from 'prop-types';
import React from 'react';

import { Modal, FooterModal, PrimaryButton, ResetButton, ContentModal } from 'react-components';

const getAction = (node, cb) => {
    if (!node) {
        return null;
    }

    if (typeof node === 'string') {
        return cb();
    }

    return node;
};

const RenderModal = ({ container, title, submit, close, onClose, onSubmit }) => {
    return (
        <Modal show={true} onClose={onClose} title={title} type="small">
            <ContentModal onSubmit={onSubmit} onReset={onClose}>
                {container}
                <FooterModal>
                    {getAction(close, () => <ResetButton>{close}</ResetButton>)}
                    {getAction(submit, () => <PrimaryButton type="submit">{submit}</PrimaryButton>)}
                </FooterModal>
            </ContentModal>
        </Modal>
    )
};

RenderModal.propTypes = {
    onSubmit: PropTypes.func,
    onClose: PropTypes.func,
    container: PropTypes.node.isRequired,
    title: PropTypes.string.isRequired,
    submit: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.node,
    ]),
    close: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.node,
    ])
};

RenderModal.defaultProps = {
    onSubmit: () => {},
    onClose: () => {}
};

export default RenderModal;
