/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import React, { useState } from 'react';
import logo from './img/logo.png';
import product from './img/product.png';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import './App.css';

/*******************************************************************************************************/
// Configuración de Stripe //
/*******************************************************************************************************/
// Llave pública de stripe
const public_key =
	'pk_test_51JNtuqF0ZPDJmgDa2cQ9YNhqf8ZmQpquWv5seWZsJ7lNVxMSCFfeXjZiviNhUpsmMP1DYCNSxwXbCHcc20fgqBRV00JE5OyYSh';

/*******************************************************************************************************/
// Opciones de configuración de los elementos de stripe //
/*******************************************************************************************************/
const ELEMENTS_OPTIONS = {
	fonts: [
		{
			// Establecemos la fuente Roboto al igual que el css de la App
			cssSrc: 'https://fonts.googleapis.com/css?family=Roboto'
		}
	]
};

/*******************************************************************************************************/
// Opciones de configuración de la tarjeta //
/*******************************************************************************************************/
const CARD_OPTIONS = {
	iconStyle: 'solid',
	style: {
		base: {
			fontWeight: 500,
			fontFamily: 'Roboto, Open Sans, Segoe UI, sans-serif',
			fontSize: '16px',
			fontSmoothing: 'antialiased',
			':-webkit-autofill': {
				color: '#aaaaaa'
			},
			'::placeholder': {
				color: '#aaaaaa'
			}
		},
		invalid: {
			iconColor: '#FF3232',
			color: '#FF3232'
		}
	}
};

/*******************************************************************************************************/
// Definimos el Field del Formulario //
/*******************************************************************************************************/
const Field = props => {
	// Obtenemos las propiedades del componente
	const { label, id, name, type, placeholder, autoComplete, value, onChange, required } = props;

	// Renderizamos el componente
	return (
		<div className="FormRow">
			<label htmlFor={id} className="FormRowLabel">
				{label}
			</label>
			<input
				className="FormRowInput"
				id={id}
				name={name}
				type={type}
				placeholder={placeholder}
				autoComplete={autoComplete}
				value={value}
				onChange={onChange}
				required={required}
			/>
		</div>
	);
};

/*******************************************************************************************************/
// Definimos el Formulario de Verificación de la Transacción //
/*******************************************************************************************************/
const CheckoutForm = () => {
	// Hook que retorna la referencia a Stripe
	const stripe = useStripe();
	// Hook que contiene la información recolectada de un elemento de la Api de Stripe
	const elements = useElements();

	// Estado del error al procesar la transacción
	const [error, setError] = useState(null);
	// Estado de haberse completado la tarjeta
	const [cardComplete, setCardComplete] = useState(false);
	// Estado de procesar la transacción
	const [processing, setProcessing] = useState(false);

	// Valor del método del pago o transacción
	const [paymentMethod, setPaymentMethod] = useState(null);

	// Valores de los campos de facturación
	const [billingDetails, setBillingDetails] = useState({
		email: '',
		phone: '',
		name: ''
	});

	// Función para guardar los cambios de los datos de facturación en el formulario
	const handleInputChange = evt => {
		// Obtenemos las propiedades el input seleccionado
		const { name, value } = evt.target;

		// Guardamos los datos de facturación
		setBillingDetails({
			...billingDetails,
			[name]: value
		});
	};

	// Función para enviar el formulario
	const handleSubmit = async evt => {
		// Evitar que la página se refresque
		evt.preventDefault();

		// Si Stripe no se ha cargado y no hay información de elementos
		if (!stripe || !elements) {
			// Retornamos el envío del formulario
			return;
		}

		// Si existe un error
		if (error) {
			// Hacemos un focus a la tarjta
			elements.getElement('card').focus();
			// Retornamos el envío del formulario
			return;
		}

		// Si se completó la tarjeta
		if (cardComplete) {
			// Iniciamos el proceso
			setProcessing(true);
		}

		// Obtenemos la referencia del elemento: CardElement
		const cardElement = elements.getElement(CardElement);

		// Usamos a CardElement y creamos el método de pago de Stripe
		const payload = await stripe.createPaymentMethod({
			type: 'card', // Tipo: "tarjeta"
			card: cardElement // Elemento que contiene los datos de la tarjeta
		});

		// Finalizamos el proceso
		setProcessing(false);

		// Si existe un error en el método de pago
		if (payload.error) {
			// Mostramos el error de pago en consola
			console.log('[error payment]', payload.error);
		} else {
			// Guardamos los datos del método de pago
			setPaymentMethod(payload.paymentMethod);
		}
	};

	// Función para resetear o limpiar el pago
	const reset = () => {
		setError(null);
		setProcessing(false);
		setPaymentMethod(null);
		setBillingDetails({
			email: '',
			phone: '',
			name: ''
		});
	};

	// Función que se ejecuta si hay un error
	const alertError = () => {
		alert(error.message);
	};

	// Si existe un método de pago exitoso
	if (paymentMethod) {
		// Renderizamos el componente
		return (
			<div className="Result">
				<div className="ResultTitle" role="alert">
					Pago exitoso
				</div>
				<div className="ResultMessage">Se generó un método de pago: {paymentMethod.id}</div>
				<button type="button" className="btn btn-danger" onClick={reset}>
					Reiniciar
				</button>
			</div>
		);
	}

	// Caso contrario
	else {
		//Renderizamos el componente
		return (
			<form className="Form" onSubmit={handleSubmit}>
				<fieldset className="FormGroup">
					<Field
						label="Nombre"
						id="name"
						name="name"
						type="text"
						placeholder="Carlos Santander"
						value={billingDetails.name}
						onChange={handleInputChange}
						required
					/>
					<Field
						label="Correo"
						id="email"
						name="email"
						type="email"
						autoComplete="email"
						placeholder="micorreo@gmail.com"
						value={billingDetails.email}
						onChange={handleInputChange}
						required
					/>
					<Field
						label="Teléfono"
						id="phone"
						name="phone"
						type="tel"
						placeholder="33 1104 1656"
						autoComplete="tel"
						value={billingDetails.phone}
						onChange={handleInputChange}
						required
					/>
				</fieldset>
				<fieldset className="FormGroup">
					<div className="FormRow">
						<CardElement
							options={CARD_OPTIONS}
							onChange={evt => {
								setError(evt.error);
								setCardComplete(evt.complete);
							}}
						/>
					</div>
				</fieldset>
				{error && alertError}
				<div className="BtnGroup">
					<div className="d-grid gap-2">
						<button type="submit" className="btn btn-primary" disabled={processing || !stripe}>
							{processing ? 'Procesando...' : 'Pagar'}
						</button>
					</div>
				</div>
			</form>
		);
	}
};

/*******************************************************************************************************/
// Definimos el componente //
/*******************************************************************************************************/
const App = () => {
	// Cargamos stripe usando la llave pública (fuera del componente para que no se cargue con cada render)
	const [stripePromise] = useState(() => loadStripe(public_key));

	// Renderizamos el componente
	return (
		<div className="App">
			<header className="App-header">
				<img src={logo} className="App-logo" alt="logo" />
				<h3>Stripe App</h3>
			</header>
			<div className="App-body">
				<div className="container">
					<div className="row justify-content-md-center">
						<div className="col col-md-8">
							<img src={product} class="img-fluid" alt="product" />
							<Elements stripe={stripePromise} options={ELEMENTS_OPTIONS}>
								<CheckoutForm />
							</Elements>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

/*******************************************************************************************************/
// Exportamos el componente por defecto //
/*******************************************************************************************************/
export default App;
