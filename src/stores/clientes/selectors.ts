import { ClientesState } from './types';

export const selectFilteredClientes = (state: ClientesState) => {
  const { clientes, filters } = state;
  const searchTerm = filters.search.toLowerCase();

  if (!searchTerm) return clientes;

  return clientes.filter((client) => {
    return (
      client.name.toLowerCase().includes(searchTerm) ||
      client.identifier.toLowerCase().includes(searchTerm) ||
      client.email?.toLowerCase().includes(searchTerm)
    );
  });
};

export const selectClienteById = (state: ClientesState, id: string) => {
  return state.clientes.find((c) => c.id === id);
};

export const selectClienteStats = (state: ClientesState) => {
  return {
    total: state.clientes.length,
    // Add more stats if needed
  };
};
