import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { c, msgid } from 'ttag';
import { useNotifications, PrimaryButton } from 'react-components';

import SelectAddress from '../shared/SelectAddress';
import RenderModal from '../shared/RenderModal';
import Warning from './Warning';
import useSelectAndDecryptStep from './useSelectAndDecryptStep';
import ImportKeysList, { STATUS, convertStatus } from './ImportKeysList';

const getInitialState = (Addresses) => {
    if (Addresses.length === 1) {
        const address = Addresses[0];
        return {
            address,
            step: 0
        }
    }
    return {
        step: 0
    }
};

const getState = (files = [], results = {}) => {
    return files.map(({ info }) => {
        const [fingerprint] = info.fingerprints;
        return {
            fingerprint,
            ...convertStatus(results[fingerprint], STATUS.LOADING)
        };
    })
};

const ImportKeyModalProcess = ({ Addresses, importKeys, onSuccess, onClose }) => {
    const [state, setState] = useState(getInitialState(Addresses));
    const { createNotification } = useNotifications();
    const selectAndDecryptStep = useSelectAndDecryptStep();
    const [done, setDone] = useState(false);

    const [addressIndex, setAddressIndex] = useState(0);
    const { step, address } = state;
    const [list, setList] = useState([]);

    const handleSelectFiles = async (files = []) => {
        setList(getState(files, {}));
        setState({ ...state, step: 3 });

        const decryptedKeys = files.reduce((acc, { info, decryptedPrivateKey }) => {
            const [fingerprint] = info.fingerprints;
            acc[fingerprint] = decryptedPrivateKey;
            return acc;
        }, {});

        const results = await importKeys({ Address: address, decryptedKeys });

        setList(getState(files, results));
        setDone(true);
    };

    const handleError = (text) => {
        createNotification({ type: 'error', text });
    };

    const currentStep = [
        () => ({
            title: c('Title').t`Import key`,
            container: <Warning/>,
            submit: c('Action').t`Yes`,
            onSubmit: () => setState({ ...state, step: address ? 2 : 1 }),
        }),
        () => ({
            title: c('Title').t`Select address`,
            container: <SelectAddress Addresses={Addresses} addressIndex={addressIndex} setAddressIndex={setAddressIndex} />,
            submit: c('Action').t`Select address`,
            onSubmit: () => setState({ ...state, address, step: 2 })
        }),
        () => selectAndDecryptStep(handleSelectFiles, handleError),
        () => {
            const n = list.length;
            return {
                title: c('Title').ngettext(msgid`Import key`, `Import ${n} keys`, n),
                container: (<ImportKeysList keys={list}/>),
                submit: (<PrimaryButton type="submit" disabled={!done}>{c('Action').t`Done`}</PrimaryButton>),
                onSubmit: onSuccess
            }
        }
    ][step]();

    const close = c('Action').t`Close`;

    return <RenderModal onClose={onClose} close={close} {...currentStep}/>;
};

ImportKeyModalProcess.propTypes = {
    onSuccess: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    importKeys: PropTypes.func.isRequired,
    Addresses: PropTypes.array.isRequired
};

export default ImportKeyModalProcess;
