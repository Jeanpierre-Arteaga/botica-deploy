import { AuthLayout } from '../components/AuthLayout';
import { StaffLoginForm } from '../components/StaffLoginForm';

export function AdminLogin() {
  return (
    <AuthLayout
      tone="admin"
      brandLine={
        <>
          Toda tu botica,
          <br />
          bajo control.
        </>
      }
      title="Acceso Administrador"
      subtitle="Ingresa con tus credenciales de administrador"
    >
      <StaffLoginForm role="admin" redirectTo="/admin/dashboard" codePlaceholder="ADMIN01" />
    </AuthLayout>
  );
}
