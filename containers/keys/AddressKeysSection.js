import React from 'react';
import { c } from 'ttag';

import AddressKeysHeader from './addressesKeysHeader/AddressKeysHeader';
import AddressKeysHeaderActions, { getHeaderActions } from './addressesKeysHeader/AddressKeysHeaderActions';
import ContactKeysHeader from './ContactKeysHeader';
import AddressKeysTable from './AddressKeysTable';
import { getAddressesKeys, getUserKeys } from './AddressKeysSectionModel';
import useUserKeys from '../../models/userKeysModel';
import useAddressesKeys from '../../models/addressesKeysModel';
import { useUser } from '../../models/userModel';
import { useAddresses } from '../../models/addressesModel';

const AddressKeysSection = () => {
    const [User] = useUser();
    const [Addresses, loadingAddresses] = useAddresses();

    const [userKeys, loadingUserKeys] = useUserKeys(User);
    const [addressesKeys, loadingAddressesKeys] = useAddressesKeys(User, Addresses);

    const formattedAddressesKeys = getAddressesKeys({ User, Addresses, addressesKeys });
    const formattedUserKeys = getUserKeys({ User, userKeys });

    const headerActions = getHeaderActions({
        User,
        Addresses,
        userKeys,
        addressesKeys
    });

    const loadingAll = loadingAddresses || loadingAddressesKeys || loadingUserKeys;

    const userTableTitle = c('Title').t`User`;
    const addressTableTitle = c('Title').t`Email`;

    return (
        <>
            <AddressKeysHeader/>
            {loadingAll ? null: <AddressKeysHeaderActions actions={headerActions}/>}
            <AddressKeysTable
                loading={loadingAddresses || loadingAddressesKeys}
                addressKeys={formattedAddressesKeys}
                title={addressTableTitle}
            />

            <ContactKeysHeader/>
            <AddressKeysTable
                loading={loadingUserKeys}
                addressKeys={formattedUserKeys}
                title={userTableTitle}
            />
        </>
    );
};

AddressKeysSection.propTypes = {};

export default AddressKeysSection;
