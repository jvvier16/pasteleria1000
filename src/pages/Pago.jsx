import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import logo from '../assets/img/logo.png'

// limpia el número dejando solo dígitos
const onlyDigits = (s = '') => (s || '').replace(/\D/g, '')

// formatea el número por espacios (AMEX 4-6-5)
const formatCardNumber = (num = '') => {
	const d = onlyDigits(num)
	if (/^3[47]/.test(d)) return d.replace(/(\d{1,4})(\d{1,6})?(\d{1,5})?/, (_, a, b, c) => [a, b, c].filter(Boolean).join(' '))
	return d.replace(/(\d{1,4})/g, '$1 ').trim()
}

// Luhn
const luhnCheck = (num = '') => {
	const digits = onlyDigits(num).split('').reverse().map(Number)
	let sum = 0
	for (let i = 0; i < digits.length; i++) {
		let d = digits[i]
		if (i % 2 === 1) {
			d *= 2
			if (d > 9) d -= 9
		}
		sum += d
	}
	return sum % 10 === 0
}

// tipo simple
const detectCardType = (num = '') => {
	const d = onlyDigits(num)
	if (/^4/.test(d)) return 'visa'
	if (/^5[1-5]/.test(d)) return 'mastercard'
	if (/^3[47]/.test(d)) return 'amex'
	return 'unknown'
}

export default function Pago() {
	const [name, setName] = useState('')
	const [number, setNumber] = useState('') // raw digits
	const [expiry, setExpiry] = useState('')
	const [cvv, setCvv] = useState('')
	const [errors, setErrors] = useState({})

	const cardType = detectCardType(number)
	const formattedNumber = formatCardNumber(number)

	const validate = () => {
		const e = {}
		if (!name.trim()) e.name = 'Ingresa el nombre que aparece en la tarjeta'

		const digits = onlyDigits(number)
		if (digits.length < 13 || digits.length > 19 || !luhnCheck(number)) e.number = 'Número de tarjeta inválido'

		if (!/^(0[1-9]|1[0-2])\/(\d{2})$/.test(expiry)) e.expiry = 'Formato MM/AA'
		else {
			const [mm, yy] = expiry.split('/')
			const exp = new Date(Number('20' + yy), Number(mm) - 1, 1)
			const end = new Date(exp.getFullYear(), exp.getMonth() + 1, 0)
			const now = new Date()
			if (end < now) e.expiry = 'Tarjeta expirada'
		}

		const cvvDigits = onlyDigits(cvv)
		const cvvLen = cardType === 'amex' ? 4 : 3
		if (cvvDigits.length !== cvvLen) e.cvv = `CVV debe tener ${cvvLen} dígitos`

		setErrors(e)
		return Object.keys(e).length === 0
	}

	const onSubmit = (ev) => {
		ev.preventDefault()
		if (!validate()) return
		alert('Pago simulado exitoso')
	}

	return (
		<>
			

			<main className="container my-5">
				<h2 className="mb-4 text-center w-100">Pago</h2>

				<div className="payment-container">
					<div className="payment-card">
						<form onSubmit={onSubmit} noValidate>
							<div className="mb-3">
								<label htmlFor="nombre" className="form-label">Nombre en la tarjeta</label>
								<input type="text" className="form-control" id="nombre" value={name} onChange={(e) => setName(e.target.value)} />
								{errors.name && <div className="field-error">{errors.name}</div>}
							</div>

							<div className="mb-3">
								<label htmlFor="numero" className="form-label">Número de tarjeta</label>
								<input
									type="text"
									className="form-control"
									id="numero"
									value={formattedNumber}
									onChange={(e) => setNumber(onlyDigits(e.target.value))}
									inputMode="numeric"
									placeholder="1234 5678 9012 3456"
								/>
								{errors.number && <div className="field-error">{errors.number}</div>}
							</div>

							<div className="row mb-3">
								<div className="col">
									<label htmlFor="expira" className="form-label">Expira</label>
									<input type="text" className="form-control" id="expira" placeholder="MM/AA" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
									{errors.expiry && <div className="field-error">{errors.expiry}</div>}
								</div>
								<div className="col">
									<label htmlFor="cvv" className="form-label">CVV</label>
									<input type="text" className="form-control" id="cvv" maxLength={4} value={cvv} onChange={(e) => setCvv(onlyDigits(e.target.value))} />
									{errors.cvv && <div className="field-error">{errors.cvv}</div>}
								</div>
							</div>

							<button type="submit" className="btn btn-success w-100">Pagar</button>
						</form>
					</div>

					<div>
						<div className="card-preview">
							<div className="d-flex justify-content-between align-items-start">
								<img src={logo} alt="logo" style={{ height: 28 }} />
								<span style={{ textTransform: 'capitalize' }}>{cardType}</span>
							</div>
							<div className="number">{formattedNumber || '#### #### #### ####'}</div>
							<div className="d-flex justify-content-between align-items-center">
								<div className="name">{name || 'NOMBRE APELLIDO'}</div>
								<div className="exp">{expiry || 'MM/AA'}</div>
							</div>
						</div>
					</div>
				</div>
			</main>

			
		</>
	)
}
