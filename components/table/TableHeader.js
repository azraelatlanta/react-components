import React from 'react';
import PropTypes from 'prop-types';

import TableCell from './TableCell';

const TableHeader = ({ cells, ...rest }) => {
    return (
        <thead {...rest}>
            <tr>
                {cells.map((cell, index) => {
                    // TODO: FIX THIS
                    // Allow to specify an object or a node to be able to extend the table cell
                    const { el, ...rest } = React.isValidElement(cell) ? { el: cell } : cell;
                    console.log(rest, cell, React.isValidElement(cell));
                    return <TableCell key={index.toString()} type="header" {...rest}>{el}</TableCell>;
                })}
            </tr>
        </thead>
    );
};

TableHeader.propTypes = {
    cells: PropTypes.arrayOf(PropTypes.node)
};

TableHeader.defaultProps = {
    cells: []
};

export default TableHeader;
