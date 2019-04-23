import React, { forwardRef, useRef, useEffect, useImperativeHandle } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { FileInput } from 'react-components';
import { parseKeys } from 'proton-shared/lib/keys/keyImport';

const SelectFiles = forwardRef(({ onFiles, autoClick }, ref) => {
    const fileRef = useRef();

    const handleFileImport = async ({ target }) => {
        const keys = await parseKeys(Array.from(target.files));
        // Reset it to allow to select the same file again.
        fileRef.current.value = '';
        onFiles(keys);
    };

    useEffect(() => {
        if (autoClick) {
            fileRef.current.click();
        }
    }, [autoClick]);

    useImperativeHandle(ref, () => ({
        click: () => {
            fileRef.current.click();
        }
    }));

    return (
        <FileInput
            accept='.txt,.asc'
            ref={fileRef}
            className={'hidden'}
            multiple={true}
            onChange={handleFileImport}
        >
            {c('Select files').t`Upload`}
        </FileInput>
    );
});

SelectFiles.propTypes = {
    onFiles: PropTypes.func.isRequired,
    autoClick: PropTypes.bool
};

export default SelectFiles;
