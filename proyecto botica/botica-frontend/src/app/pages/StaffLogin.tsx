import { AuthLayout } from '../components/AuthLayout';
import { StaffLoginForm } from '../components/StaffLoginForm';

export function StaffLogin() {
  return (
    <AuthLayout
      tone="staff"
      brandLine={
        <>
          Tu sede, tu turno,
          <br />
          todo en un panel.
        </>
      }
      title="Acceso Personal"
      subtitle="Ingresa con tu código de trabajador"
    >
      <StaffLoginForm role="emp" redirectTo="/staff/dashboard" codePlaceholder="TRAB01" />
    </AuthLayout>
  );
}
