import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Palette, Mail, Lock, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export default function AdminLogin() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (isSignUp) {
      const { error } = await signUp(email, password);
      if (error) {
        toast({ title: 'Erro no cadastro', description: error.message, variant: 'destructive' });
      } else {
        // Auto-confirm enabled: sign in immediately after signup
        const { error: signInError } = await signIn(email, password);
        if (signInError) {
          toast({ title: 'Conta criada!', description: 'Faça login com suas credenciais.' });
        } else {
          navigate('/admin');
        }
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: 'Erro no login', description: error.message, variant: 'destructive' });
      } else {
        navigate('/admin');
      }
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
            <Palette className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="font-display text-2xl">
            {isSignUp ? 'Criar conta empresarial' : 'Área Administrativa'}
          </CardTitle>
          <CardDescription>
            {isSignUp
              ? 'Cadastre sua empresa para personalizar a plataforma'
              : 'Acesse o painel da sua empresa'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="empresa@exemplo.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="pl-9"
                  required
                  minLength={6}
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              <Building2 className="w-4 h-4 mr-2" />
              {submitting ? 'Aguarde...' : isSignUp ? 'Criar conta' : 'Entrar'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isSignUp ? 'Já tem conta? Faça login' : 'Não tem conta? Cadastre-se'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
