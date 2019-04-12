import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import LoadingModal from './LoadingModal';

const GeneratingModal = ({ title, generate, onClose, onSuccess }) => {
    useEffect(() => {
        generate()
            .then(onSuccess)
            .catch((e) => {
                console.error(e);
                onClose()
            });
    }, []);

    return <LoadingModal onClose={onClose} title={title}/>
};

GeneratingModal.propTypes = {
    onSuccess: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    generate: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired
};

export default GeneratingModal;
