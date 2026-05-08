"use client"

import { Scale, Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from "lucide-react"
import { motion } from "framer-motion"
import { useSelector } from "react-redux"
import i18n from "../../json/footer.json" // adjust path if needed

const Footer = () => {
  const currentLanguage = useSelector((state) => state.language.currentLanguage)
  const t = i18n[currentLanguage].footer

  const footerLinks = {
    [t.sections.quickLinks.title]: [
      t.sections.quickLinks.items.home,
      t.sections.quickLinks.items.findLawyers,
      t.sections.quickLinks.items.submitCase,
      t.sections.quickLinks.items.resources,
      t.sections.quickLinks.items.aboutUs,
    ],
    [t.sections.legalServices.title]: [
      t.sections.legalServices.items.familyLaw,
      t.sections.legalServices.items.propertyLaw,
      t.sections.legalServices.items.immigration,
      t.sections.legalServices.items.criminalDefense,
      t.sections.legalServices.items.civilRights,
    ],
    [t.sections.resources.title]: [
      t.sections.resources.items.legalDocuments,
      t.sections.resources.items.faq,
      t.sections.resources.items.blog,
      t.sections.resources.items.caseStudies,
      t.sections.resources.items.legalGuides,
    ],
    [t.sections.support.title]: [
      t.sections.support.items.helpCenter,
      t.sections.support.items.contactUs,
      t.sections.support.items.privacyPolicy,
      t.sections.support.items.termsOfService,
      t.sections.support.items.accessibility,
    ],
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <footer className="bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.div className="lg:col-span-2" variants={itemVariants}>
            <div className="flex items-center gap-2 mb-4">
              <Scale className="w-8 h-8 text-cyan-600" />
              <span className="text-xl font-bold text-slate-800">
                {t.brand.name}
              </span>
            </div>

            <p className="text-slate-600 mb-6 leading-relaxed">
              {t.brand.description}
            </p>

            <div className="space-y-2">
              <motion.div
                className="flex items-center gap-2 text-slate-600"
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Mail className="w-4 h-4 text-cyan-600" />
                <span>{t.contact.email}</span>
              </motion.div>

              <motion.div
                className="flex items-center gap-2 text-slate-600"
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
              
                <Phone className="w-4 h-4 text-cyan-600" />
                <span>{t.contact.phone}</span>
              </motion.div>

              <motion.div
                className="flex items-center gap-2 text-slate-600"
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <MapPin className="w-4 h-4 text-cyan-600" />
                <span>{t.contact.address}</span>
              </motion.div>
            </div>
          </motion.div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <motion.div key={category} variants={itemVariants}>
              <h3 className="font-semibold text-slate-800 mb-4">
                {category}
              </h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <motion.button
                      className="text-slate-600 hover:text-cyan-600 transition-colors text-left"
                      whileHover={{ x: 3 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {link}
                    </motion.button>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="border-t border-slate-200 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <div className="text-slate-600 text-sm mb-4 md:mb-0">
            {t.bottom.copyright}
          </div>

          <div className="flex items-center space-x-4">
            {[Facebook, Twitter, Linkedin, Instagram].map((Icon, index) => (
              <motion.button
                key={index}
                className="text-slate-600 hover:text-cyan-600 transition-colors"
                whileHover={{ scale: 1.2, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Icon className="w-5 h-5" />
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </footer>
  )
}

export default Footer
