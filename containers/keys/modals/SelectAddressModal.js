import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import {
    Select,
    Alert,
    Modal,
    ContentModal,
    Row,
    FooterModal,
    ResetButton,
    PrimaryButton
} from 'react-components';

const SelectAddressModal = ({ Addresses, onClose, onSuccess }) => {
    const [addressIndex, setAddressIndex] = useState(0);

    const handleSubmit = async () => {
        onSuccess(Addresses[addressIndex]);
    };

    const title = c('Title').t`Select address`;
    const notificationText = c('Alert').t`Select an address to which the new key will be attached`;

    const options = Addresses.map((address, i) => ({
        text: address.Email,
        value: i
    }));

    return (
        <Modal show={true} onClose={onClose} title={title} type="small">
            <ContentModal onSubmit={handleSubmit} onReset={onClose}>
                <Alert>{notificationText}</Alert>
                <Row>
                    <Select
                        value={addressIndex}
                        options={options}
                        onChange={({ target }) => setAddressIndex(target.value)}
                    />
                </Row>
                <FooterModal>
                    <ResetButton>{c('Label').t`Cancel`}</ResetButton>
                    <PrimaryButton type="submit">{c('Label').t`Next`}</PrimaryButton>
                </FooterModal>
            </ContentModal>
        </Modal>
    );
};

SelectAddressModal.propTypes = {
    onSuccess: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    Addresses: PropTypes.array.isRequired
};
export default SelectAddressModal;
