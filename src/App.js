/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import React, { useState } from 'react';
import logo from './img/logo.png';
import product from './img/product.png';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';
import './App.css';
import { formatCurrency } from './helpers/formatters';

/*******************************************************************************************************/
// Ruta del API o Endpoint de Stripe Test //
/*******************************************************************************************************/
const baseUrl = 'http://localhost:4000';

/*******************************************************************************************************/
// Configuración de Stripe //
/*******************************************************************************************************/
// Llave pública de stripe (Se debe colocar la creada con su cuenta personal en la página de Stripe)
const public_key = process.env.REACT_APP_STRIPE_PUBLIC_KEY || '';

/*******************************************************************************************************/
// Opciones de configuración de los elementos de stripe //
/*******************************************************************************************************/
const ELEMENTS_OPTIONS = {
	// Establecemos las opciones de la fuente
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
const CheckoutForm = props => {
	// Obtenemos las propiedades
	const { amount } = props;

	// Hook que retorna la referencia a Stripe
	const stripe = useStripe();
	// Hook que contiene la información recolectada de un elemento de la Api de Stripe
	const elements = useElements();

	// Estado del error al introducir los datos de la tarjeta
	const [error, setError] = useState(null);
	// Estado de haberse completado la tarjeta
	const [cardComplete, setCardComplete] = useState(false);
	// Estado de procesar la transacción
	const [processing, setProcessing] = useState(false);

	// Valor del método del pago o transacción
	const [paymentMethod, setPaymentMethod] = useState(null);

	// Datos del pago devuelto al procesar el pago
	const [payment, setPayment] = useState({
		error: false,
		message: '',
		id: '',
		amount: 0,
		description: ''
	});

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
			console.log(error);
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
			card: cardElement, // Elemento que contiene los datos de la tarjeta
			billing_details: billingDetails // Datos de facturación del cliente
		});

		// Si existe un error en el método de pago
		if (payload.error) {
			// Mostramos el error de pago en consola
			console.log('[error payment]', payload.error);
		} else {
			// Guardamos los datos del método de pago
			setPaymentMethod(payload.paymentMethod);
			// Mostramos en consolo el método de pago
			// console.log(payload.paymentMethod);
			// Enviamos el id del payment al servicio o api de test
			const response = await axios({
				method: 'POST',
				url: `${baseUrl}/api/checkout`,
				data: {
					id: payload.paymentMethod.id, // Id de la transacción de stripe
					amount: amount * 100 // Centavos de la moneda ($ dólares en nuestro caso)
				}
			});

			// Finalizamos el proceso
			setProcessing(false);

			// Analizamos la respuesta
			if (response.data.status) {
				// Recordar que el monto recibido está en centavos de dólar por lo que se debe dividir entre 100
				setPayment({
					...payment,
					error: false,
					id: response.data.payment.id,
					amount: response.data.payment.amount / 100,
					description: response.data.payment.description
				});
			} else {
				setPayment({
					...payment,
					error: true,
					message: response.data.message
				});
			}
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

	// Si existe un error en el pago
	if (payment.error) {
		// Renderizamos el componente
		return (
			<div className="Result">
				<div className="ResultTitle" role="alert">
					Pago fallido
				</div>
				<div className="ResultMessage">Motivo: {payment.message}</div>
				<button type="button" className="btn btn-danger ResultButton" onClick={reset}>
					Reiniciar
				</button>
			</div>
		);
	}

	// Si existe un método de pago exitoso
	if (paymentMethod && payment.error === false) {
		// Renderizamos el componente
		return (
			<div className="Result">
				<div className="ResultTitle" role="alert">
					Pago exitoso
				</div>
				<div className="ResultMessage">
					Se generó el id de stripe: <b> {paymentMethod.id}</b>
				</div>
				<div className="ResultMessage">
					Se generó el pago: <b> {payment.id}</b>
				</div>
				<div className="ResultMessage">Producto: {payment.description}</div>
				<div className="ResultMessage">Monto: {formatCurrency(payment.amount)}</div>
				<div className="ResultMessage">Se le envió la transaccion a {billingDetails.email}</div>
				<button type="button" className="btn btn-danger ResultButton" onClick={reset}>
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

	// Especificamos el monto del producto
	const [amount] = useState(2800);

	// Renderizamos el componente
	return (
		<div className="App">
			<header className="App-header">
				<img src={logo} className="App-logo" alt="logo" />
				<h3>Stripe App</h3>
			</header>
			<div className="App-body container-fluid">
				<div className="row">
					<div className="col col-md-8">
						<div className="row justify-content-md-center">
							<div className="col col-md-10">
								<div className="container-product">
									<img src={product} className="product-image" alt="product" />
									<h4 className="product-desc">Laptop Dell Alienware M15</h4>
									<h2 className="product-price">{formatCurrency(amount)}</h2>
								</div>
								<Elements stripe={stripePromise} options={ELEMENTS_OPTIONS}>
									<CheckoutForm amount={amount} />
								</Elements>
							</div>
						</div>
					</div>
					<div className="col col-md-4">
						<div className="row justify-content-md-center">
							<div className="col col-md-11">
								<div className="container-cards">
									<h3>Lista de Tarjetas de Prueba</h3>
									<br />
									<ul className="list-group">
										<h5>Exitosas</h5>
										<li className="list-group-item d-flex justify-content-between align-items-center">
											4242 4242 4242 4242
											<span className="badge bg-primary rounded-pill">Visa</span>
										</li>
										<li className="list-group-item d-flex justify-content-between align-items-center">
											5555 5555 5555 4444
											<span className="badge bg-primary rounded-pill">Mastercard</span>
										</li>
										<li className="list-group-item d-flex justify-content-between align-items-center">
											3782 822463 10005
											<span className="badge bg-primary rounded-pill">American Express</span>
										</li>
										<li className="list-group-item d-flex justify-content-between align-items-center">
											3056 9300 0902 0004
											<span className="badge bg-primary rounded-pill">Diners Club</span>
										</li>
									</ul>
									<br />
									<ul className="list-group">
										<h5>Error</h5>
										<li className="list-group-item d-flex justify-content-between align-items-center">
											4000 0000 0000 9235
											<span className="badge bg-danger rounded-pill">risk_level</span>
										</li>
										<li className="list-group-item d-flex justify-content-between align-items-center">
											4000 0000 0000 0002
											<span className="badge bg-danger rounded-pill">card_declined</span>
										</li>
										<li className="list-group-item d-flex justify-content-between align-items-center">
											4000 0000 0000 9995
											<span className="badge bg-danger rounded-pill">insufficient_funds</span>
										</li>
										<li className="list-group-item d-flex justify-content-between align-items-center">
											4000 0000 0000 9987
											<span className="badge bg-danger rounded-pill">lost_card</span>
										</li>
										<li className="list-group-item d-flex justify-content-between align-items-center">
											4000 0000 0000 9979
											<span className="badge bg-danger rounded-pill">stolen_card</span>
										</li>
										<li className="list-group-item d-flex justify-content-between align-items-center">
											4000 0000 0000 0069
											<span className="badge bg-danger rounded-pill">expired_card</span>
										</li>
										<li className="list-group-item d-flex justify-content-between align-items-center">
											4000 0000 0000 0127
											<span className="badge bg-danger rounded-pill">incorrect_cvc</span>
										</li>
										<li className="list-group-item d-flex justify-content-between align-items-center">
											4000 0000 0000 0101
											<span className="badge bg-danger rounded-pill">cvc_check</span>
										</li>
										<li className="list-group-item d-flex justify-content-between align-items-center">
											4000 0000 0000 0119
											<span className="badge bg-danger rounded-pill">processing_error</span>
										</li>
										<li className="list-group-item d-flex justify-content-between align-items-center">
											4242 4242 4242 4241
											<span className="badge bg-danger rounded-pill">incorrect_number</span>
										</li>
										<li className="list-group-item d-flex justify-content-between align-items-center">
											5555 5555 5555 4220
											<span className="badge bg-danger rounded-pill">brand_product</span>
										</li>
									</ul>
								</div>
							</div>
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
