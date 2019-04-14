import React, { forwardRef, useRef, useEffect, useState, useImperativeHandle } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { FileInput } from 'react-components';

import { parseKeys } from './selectFilesHelper';

const SelectFiles = forwardRef(({ onSuccess, onError }, ref) => {
    const [loading, setLoading] = useState(false);
    const fileRef = useRef();

    const handleFileImport = async ({ target }) => {
        setLoading(true);

        const keys = await parseKeys(Array.from(target.files));

        // Reset it to allow to select the same file again.
        fileRef.current.value = '';

        if (!keys.length) {
            onError(c('Error').t`Invalid private key file`);
            return setLoading(false);
        }

        onSuccess(keys);
    };

    useEffect(() => {
        fileRef.current.click();
    }, []);

    useImperativeHandle(ref, () => ({
        click: () => {
            fileRef.current.click();
        }
    }));

    return (
        <>
            <FileInput
                accept='.txt,.asc'
                disabled={loading}
                ref={fileRef}
                className={'hidden'}
                multiple={true}
                onChange={handleFileImport}
            >
                {c('Select files').t`Upload`}
            </FileInput>
        </>
    );
});

SelectFiles.propTypes = {
    onSuccess: PropTypes.func.isRequired,
    onError: PropTypes.func.isRequired
};
export default SelectFiles;
