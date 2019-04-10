import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

import { generateUID } from '../../helpers/component';

const SelectFilesInput = ({ onClose, onSuccess, accept, multiple }) => {
    const ref = useRef();

    const fileId = generateUID('select-file');

    const handleFileImport = ({ target }) => {
        const files = Array.from(target.files);
        if (!files.length) {
            return onClose();
        }
        onSuccess(files);
    };

    useEffect(() => {
        ref.current.click();
    }, []);

    return (
        <input
            id={fileId}
            type='file'
            onChange={handleFileImport}
            accept={accept}
            multiple={multiple}
            ref={ref}
            style={({display: 'none'})}
        />
    );
};

SelectFilesInput.propTypes = {
    onSuccess: PropTypes.func.isRequired,
    accept: PropTypes.string.isRequired,
    multiple: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired
};
export default SelectFilesInput;
