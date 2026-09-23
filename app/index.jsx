import { useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

export default function Lista() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [cuentos, setCuentos] = useState([]);

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      async function cargar() {
        const filas = await db.getAllAsync(
          'SELECT id, titulo, cuerpo, editado FROM cuento ORDER BY editado DESC'
        );
        if (activo) setCuentos(filas);
      }
      cargar();
      return () => { activo = false; };
    }, [db])
  );

  return (
    <View style={styles.contenedor}>
      <Stack.Screen
        options={{
          title: `Cuentero (${cuentos.length})`,
          headerRight: () => (
            <Pressable onPress={() => router.push('/ajustes')}>
              <Text style={{ color: '#fff', fontSize: 16 }}>Ajustes</Text>
            </Pressable>
          ),
        }}
      />

      <FlatList
        data={cuentos}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListEmptyComponent={
          <Text style={styles.vacio}>Todavia no hay cuentos. Toca + para escribir el primero.</Text>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.tarjeta} onPress={() => router.push(`/cuento/${item.id}`)}>
            <Text style={styles.tarjetaTitulo}>{item.titulo}</Text>
            <Text style={styles.tarjetaVistaPrevia} numberOfLines={2}>
              {item.cuerpo ? item.cuerpo.slice(0, 80) : ''}
            </Text>
            <Text style={styles.tarjetaFecha}>
              {new Date(item.editado).toLocaleDateString('es-PE')}
            </Text>
          </Pressable>
        )}
      />

      <Pressable style={styles.boton} onPress={() => router.push('/cuento/nuevo')}>
        <Text style={styles.botonTexto}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#f7f5f0' },
  tarjeta: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e8e2d5',
  },
  tarjetaTitulo: { fontSize: 16, fontWeight: '600', color: '#1b4332' },
  tarjetaVistaPrevia: { fontSize: 13, color: '#5a6b5f', marginTop: 4 },
  tarjetaFecha: { fontSize: 12, color: '#7a8b7f', marginTop: 4 },
  vacio: { textAlign: 'center', color: '#7a8b7f', marginTop: 40 },
  boton: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1b4332',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  botonTexto: { color: '#fff', fontSize: 28, lineHeight: 30 },
});
