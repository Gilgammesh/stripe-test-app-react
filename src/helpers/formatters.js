/*******************************************************************************************************/
// Función para formatear un número a currency con decimal //
/*******************************************************************************************************/
// Función para formatear un numero a decimal
export const formatCurrency = value => {
	const formatter = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD'
	});
	return formatter.format(value);
};
