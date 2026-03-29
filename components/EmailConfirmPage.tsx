
import React from 'react';
import { CheckCircle, Music } from 'lucide-react';

interface Props {
  onContinue: () => void;
}

const EmailConfirmPage: React.FC<Props> = ({ onContinue }) => {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center">
              <Music className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">Email confirmé !</h1>
        <p className="text-slate-400 mb-8">
          Ton adresse email a bien été vérifiée. Tu peux maintenant accéder à toutes les fonctionnalités d'Unison.
        </p>

        <button
          onClick={onContinue}
          className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors"
        >
          Accéder à mon compte
        </button>
      </div>
    </div>
  );
};

export default EmailConfirmPage;
