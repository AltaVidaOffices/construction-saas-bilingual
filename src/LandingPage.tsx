import React, { useState } from 'react';
import { Mail, Lock, Globe } from 'lucide-react';

export default function LandingPage() {
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const content = {
    en: {
      title: 'Build Better Together',
      subtitle: 'Construction Invoicing & Proposals',
      description: 'Professional billing and proposal management for construction companies',
      email: 'Email',
      password: 'Password',
      login: 'Login',
      forgotPassword: 'Forgot password?',
      noAccount: "Don't have an account?",
      signUp: 'Contact us',
      language: 'Español',
    },
    es: {
      title: 'Construir Mejor Juntos',
      subtitle: 'Facturación y Propuestas para Construcción',
      description: 'Gestión profesional de facturación y propuestas para empresas de construcción',
      email: 'Correo Electrónico',
      password: 'Contraseña',
      login: 'Iniciar Sesión',
      forgotPassword: '¿Olvidaste tu contraseña?',
      noAccount: '¿No tienes cuenta?',
      signUp: 'Contáctanos',
      language: 'English',
    },
  };

  const t = content[language];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <button
        onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
        className="absolute top-6 right-6 flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-shadow"
      >
        <Globe className="w-4 h-4" />
        <span className="text-sm font-medium">{t.language}</span>
      </button>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-lg mb-4">
            <span className="text-2xl font-bold text-white">🏗️</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.title}</h1>
          <p className="text-indigo-600 font-semibold mb-2">{t.subtitle}</p>
          <p className="text-gray-600 text-sm">{t.description}</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                {t.email}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                {t.password}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="text-right">
              <a href="#" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                {t.forgotPassword}
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2 rounded-lg transition-colors duration-200"
            >
              {isLoading ? '...' : t.login}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            {t.noAccount}{' '}
            <a href="mailto:wealth@altavidacapital.com" className="text-indigo-600 hover:text-indigo-700 font-medium">
              {t.signUp}
            </a>
          </div>
        </div>

        <div className="text-center mt-6 text-xs text-gray-500">
          <p>© 2026 AltaVida Capital. {language === 'en' ? 'All rights reserved.' : 'Todos los derechos reservados.'}</p>
        </div>
      </div>
    </div>
  );
}
