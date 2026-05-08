"use client"

import { useState } from "react"
import { useSelector } from "react-redux"
import { motion } from "framer-motion"
import { Phone, Mail, MapPin, Send, MessageCircle, HelpCircle } from "lucide-react"
import translations from "../../json/contact.json" // adjust path if needed

const ContactPage = () => {
  const { currentLanguage } = useSelector((state) => state.language)
  const t = translations[currentLanguage].contact

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    urgency: "normal",
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log("Form submitted:", formData)
  }

  const contactMethods = [
    {
      icon: <Phone className="w-6 h-6" />,
      title: t.methods.phone.title,
      description: t.methods.phone.description,
      contact: "+1 (555) 123-4567",
      availability: t.methods.phone.availability,
    },
    {
      icon: <Mail className="w-6 h-6" />,
      title: t.methods.email.title,
      description: t.methods.email.description,
      contact: "help@legalaidpro.com",
      availability: t.methods.email.availability,
    },
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: t.methods.chat.title,
      description: t.methods.chat.description,
      contact: "Available on website",
      availability: t.methods.chat.availability,
    },
    {
      icon: <HelpCircle className="w-6 h-6" />,
      title: t.methods.help.title,
      description: t.methods.help.description,
      contact: "help.legalaidpro.com",
      availability: t.methods.help.availability,
    },
  ]

  const offices = [
    {
      city: t.offices.newYork,
      address: "123 Justice Street, New York, NY 10001",
      phone: "+1 (555) 123-4567",
      email: "ny@legalaidpro.com",
    },
    {
      city: t.offices.losAngeles,
      address: "456 Legal Avenue, Los Angeles, CA 90210",
      phone: "+1 (555) 234-5678",
      email: "la@legalaidpro.com",
    },
    {
      city: t.offices.chicago,
      address: "789 Law Boulevard, Chicago, IL 60601",
      phone: "+1 (555) 345-6789",
      email: "chicago@legalaidpro.com",
    },
  ]

  const faqs = [
    t.faq.q1,
    t.faq.q2,
    t.faq.q3,
    t.faq.q4,
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t.header.title}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t.header.description}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8 mb-16">

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <motion.div
              className="bg-white p-8 rounded-xl shadow-lg border border-gray-200"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {t.form.title}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.form.fullName} *
                    </label>
                    <input
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder={t.form.fullNamePlaceholder}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.form.email} *
                    </label>
                    <input
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder={t.form.emailPlaceholder}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.form.subject} *
                  </label>
                  <input
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    placeholder={t.form.subjectPlaceholder}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.form.urgency}
                  </label>
                  <select
                    name="urgency"
                    value={formData.urgency}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="low">{t.form.urgencyOptions.low}</option>
                    <option value="normal">{t.form.urgencyOptions.normal}</option>
                    <option value="high">{t.form.urgencyOptions.high}</option>
                    <option value="critical">{t.form.urgencyOptions.critical}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.form.message} *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    placeholder={t.form.messagePlaceholder}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none"
                  />
                </div>

                <motion.button
                  type="submit"
                  className="w-full bg-cyan-600 text-white py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {t.form.submit}
                </motion.button>
              </form>
            </motion.div>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <h3 className="text-xl font-bold mb-4">{t.info.title}</h3>
              <p>+1 (555) 123-4567</p>
              <p className="text-sm">{t.info.phoneTime}</p>
              <p>help@legalaidpro.com</p>
              <p className="text-sm">{t.info.emailTime}</p>
            </div>

            <div className="bg-cyan-600 p-6 rounded-xl text-white">
              <h3 className="text-xl font-bold mb-4">{t.emergency.title}</h3>
              <p className="mb-4">{t.emergency.description}</p>
              <button className="bg-amber-500 px-4 py-2 rounded-lg">
                {t.emergency.button}
              </button>
            </div>
          </div>
        </div>

        {/* Contact Methods */}
        <h2 className="text-2xl font-bold text-center mb-8">
          {t.methods.title}
        </h2>

        {/* FAQ */}
        <h2 className="text-2xl font-bold text-center mb-8">
          {t.faq.title}
        </h2>

        {faqs.map((faq, i) => (
          <div key={i} className="bg-white p-6 mb-4 rounded-xl shadow">
            <h3 className="font-semibold mb-2">{faq.question}</h3>
            <p>{faq.answer}</p>
          </div>
        ))}

        {/* Offices */}
        <h2 className="text-2xl font-bold text-center mb-8">
          {t.offices.title}
        </h2>
      </div>
    </div>
  )
}

export default ContactPage
