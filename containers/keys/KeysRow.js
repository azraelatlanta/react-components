import PropTypes from 'prop-types';
import React from 'react';
import { TableRow } from 'react-components';

const KeysRow = ({ fingerprint, type, status, actions }) => {
    return <TableRow key={fingerprint} cells={[fingerprint.substr(0,2), type, status, actions]} />;
};

KeysRow.propTypes = {
    fingerprint: PropTypes.string.isRequired,
    type: PropTypes.node.isRequired,
    status: PropTypes.node.isRequired,
    actions: PropTypes.node.isRequired
};

export default KeysRow;
