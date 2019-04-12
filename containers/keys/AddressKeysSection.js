import React from 'react';

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

    const formattedAdressesKeys = getAddressesKeys({ User, Addresses, addressesKeys });
    const formattedUserKeys = getUserKeys({ User, userKeys });

    const headerActions = getHeaderActions({
        User,
        Addresses,
        userKeys,
        addressesKeys
    });

    return (
        <>
            <AddressKeysHeader/>
            <AddressKeysHeaderActions actions={headerActions}/>
            <AddressKeysTable
                loading={loadingAddresses || loadingAddressesKeys}
                addressKeys={formattedAdressesKeys}
                mode={'address'}
            />

            <ContactKeysHeader/>
            <AddressKeysTable loading={loadingUserKeys} addressKeys={formattedUserKeys} mode={'user'}/>
        </>
    );
};

AddressKeysSection.propTypes = {};

export default AddressKeysSection;
