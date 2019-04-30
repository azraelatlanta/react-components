import React, { useMemo, useState, useLayoutEffect } from 'react';
import { c } from 'ttag';

import { useCachedAsyncResult } from 'react-components';
import AddressKeysHeader from './addressesKeysHeader/AddressKeysHeader';
import AddressKeysHeaderActions, { getHeaderActions } from './addressesKeysHeader/AddressKeysHeaderActions';
import ContactKeysHeader from './ContactKeysHeader';
import AddressKeysTable from './AddressKeysTable';
import { getAddressesKeys, getAddressKeysList, getKeyHeaderActions, getUserKeysList } from './AddressKeysSectionModel';
import useGetKeys from '../../models/useKeys';
import { useUser } from '../../models/userModel';
import { useAddresses } from '../../models/addressesModel';
import useKeysActions from './useKeysActions';
import KeysTable from './KeysTable';

const AddressKeysSection = () => {
    const [User] = useUser();
    const [Addresses, loadingAddresses] = useAddresses();
    const getKeysByID = useGetKeys();

    const [userKeysList, loadingUserKeys] = useCachedAsyncResult('USER_KEYS', () => {
        return getKeysByID(User.ID, User.Keys);
    }, [User]);

    const [addressesKeysMap, loadingAddressesKeys] = useCachedAsyncResult('ADDRESSES_KEYS', async () => {
        const addresses = Addresses || [];
        const keys = await Promise.all(addresses.map((Address) => {
            return getKeysByID(Address.ID, Address.Keys);
        }));
        return addresses.reduce((acc, { ID }, i) => {
            return {
                ...acc,
                [ID]: keys[i]
            }
        }, {});
    }, [Addresses]);

    const formattedUserKeys = useMemo(() => {
        return getUserKeysList(User, userKeysList);
    }, [userKeysList]);

    const formattedAddressesKeys = useMemo(() => {
        const addresses = Addresses || [];
        return addresses.reduce((acc, { ID }) => {
            acc[ID] = getAddressKeysList(User, Addresses, addressesKeysMap[ID]);
            return acc;
        }, {});
    }, [addressesKeysMap]);

    const [modal, setModal] = useState();

    const headerActions = getKeyHeaderActions({
        User,
        userKeysList,
        Addresses,
        addressesKeysMap,
    });

    const keysCallback = useKeysActions({
        User,
        userKeysList,
        Addresses,
        addressesKeysMap,
        modal,
        setModal
    });

    const loadingAll = loadingAddresses || loadingUserKeys || loadingAddressesKeys;

    return (
        <>
            {modal}
            <AddressKeysHeader/>
            {loadingAll ? null: <AddressKeysHeaderActions actions={headerActions} onAction={keysCallback} />}
            <AddressKeysTable
                loading={loadingAddresses || loadingAddressesKeys}
                Addresses={Addresses}
                addressesKeys={formattedAddressesKeys}
                onAction={keysCallback}
            />

            <ContactKeysHeader/>
            <KeysTable keys={formattedUserKeys} onAction={keysCallback} />
        </>
    );
};

AddressKeysSection.propTypes = {};

export default AddressKeysSection;
