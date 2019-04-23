import React, { useMemo, useState } from 'react';
import { c } from 'ttag';

import AddressKeysHeader from './addressesKeysHeader/AddressKeysHeader';
import AddressKeysHeaderActions, { getHeaderActions } from './addressesKeysHeader/AddressKeysHeaderActions';
import ContactKeysHeader from './ContactKeysHeader';
import AddressKeysTable from './AddressKeysTable';
import { getAddressesKeys, getUserKeysList } from './AddressKeysSectionModel';
import useUserKeys from '../../models/userKeysModel';
import useAddressesKeys from '../../models/addressesKeysModel';
import { useUser } from '../../models/userModel';
import { useAddresses } from '../../models/addressesModel';
import useKeysHeaderActions from './useKeysHeaderActions';
import useKeysActions from './useKeysActions';

const AddressKeysSection = () => {
    const [User] = useUser();
    const [Addresses, loadingAddresses] = useAddresses();
    const [userKeys, loadingUserKeys] = useUserKeys(User);
    const [addressesKeys, loadingAddressesKeys] = useAddressesKeys(User, Addresses);

    const userKeysList = useMemo(() => {
        return getUserKeysList(User, userKeys)
    }, [userKeys]);

    const formattedUserKeys = [{
        email: User.Name,
        keys: userKeysList
    }];

    const formattedAddressesKeys = useMemo(() => {
        return getAddressesKeys(User, Addresses, addressesKeys)
    }, [Addresses, addressesKeys]);

    const headerActions = getHeaderActions({
        User,
        Addresses,
        userKeys,
        addressesKeys
    });

    const [modal, setModal] = useState();

    console.log(addressesKeys)

    const keysCallback = useKeysActions({
        Addresses,
        addressesKeys,
        User,
        userKeys,
        modal,
        setModal
    });

    const headerCallback = useKeysHeaderActions({
        Addresses,
        addressesKeys,
        User,
        userKeys,
        modal,
        setModal
    });

    const loadingAll = loadingAddresses || loadingUserKeys || loadingAddressesKeys;

    const userTableTitle = c('Title').t`User`;
    const addressTableTitle = c('Title').t`Email`;

    return (
        <>
            {modal}
            <AddressKeysHeader/>
            {loadingAll ? null: <AddressKeysHeaderActions actions={headerActions} onAction={headerCallback} />}
            <AddressKeysTable
                loading={loadingAddresses || loadingAddressesKeys}
                addressKeys={formattedAddressesKeys}
                title={addressTableTitle}
                onAction={keysCallback}
            />

            <ContactKeysHeader/>
            <AddressKeysTable
                loading={loadingUserKeys}
                addressKeys={formattedUserKeys}
                title={userTableTitle}
                onAction={keysCallback}
            />
        </>
    );
};

AddressKeysSection.propTypes = {};

export default AddressKeysSection;
