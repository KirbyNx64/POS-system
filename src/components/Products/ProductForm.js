import React, { useState, useEffect } from 'react';
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  InputAdornment,
  Typography
} from '@mui/material';
import { useProducts } from '../../hooks/useProducts';
import { useApp } from '../../contexts/AppContext';
import { formatPrice } from '../../utils/formatPrice';

function ProductForm({ product, onClose }) {
  const { products, addProduct, updateProduct } = useProducts();
  const { state } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    image: '',
    barcode: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');

  // Categorías disponibles desde el contexto
  const categories = state.categories;

  // Función para manejar la subida de imágenes
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, image: 'Solo se permiten archivos de imagen' }));
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, image: 'La imagen no debe superar los 5MB' }));
        return;
      }

      // Convertir a base64 para almacenamiento local
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Image = e.target.result;
        setFormData(prev => ({ ...prev, image: base64Image }));
        setImagePreview(base64Image);
        setErrors(prev => ({ ...prev, image: '' }));
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        category: product.category,
        stock: product.stock.toString(),
        image: product.image || '',
        barcode: product.barcode || ''
      });
      setImagePreview(product.image || '');
    }
  }, [product]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }

    if (!formData.price || isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      newErrors.price = 'El precio debe ser un número mayor a 0';
    }

    if (!formData.category) {
      newErrors.category = 'La categoría es requerida';
    }

    if (!formData.stock || isNaN(formData.stock) || parseInt(formData.stock) < 0) {
      newErrors.stock = 'El stock debe ser un número mayor o igual a 0';
    }

    // Validar que el nombre no esté duplicado (excepto si estamos editando el mismo producto)
    const duplicateName = products.find(p => 
      p.name.toLowerCase() === formData.name.toLowerCase() && 
      p.active && 
      (!product || p.id !== product.id)
    );
    
    if (duplicateName) {
      newErrors.name = 'Ya existe un producto con este nombre';
    }

    // Validar código de barras único si se proporciona
    if (formData.barcode.trim()) {
      const duplicateBarcode = products.find(p => 
        p.barcode === formData.barcode.trim() && 
        p.active && 
        (!product || p.id !== product.id)
      );
      
      if (duplicateBarcode) {
        newErrors.barcode = 'Ya existe un producto con este código de barras';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    
    // Formatear precio con 2 decimales cuando se pierde el foco
    if (name === 'price' && value) {
      // Permitir entrada temporal, formatear después
      processedValue = value;
    }
    
    setFormData(prev => ({ ...prev, [name]: processedValue }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Manejar formateo de precio cuando se pierde el foco
  const handlePriceBlur = (e) => {
    const value = e.target.value;
    if (value && !isNaN(value)) {
      const formattedPrice = formatPrice(value);
      setFormData(prev => ({ ...prev, price: formattedPrice }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🚀 ProductForm: handleSubmit ejecutado');
    console.log('🚀 ProductForm: formData:', formData);
    
    if (!validateForm()) {
      console.log('❌ ProductForm: Validación falló');
      return;
    }

    console.log('✅ ProductForm: Validación exitosa, procediendo a guardar...');
    setLoading(true);

    try {
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        category: formData.category,
        stock: parseInt(formData.stock),
        image: formData.image.trim(),
        barcode: formData.barcode.trim()
      };

      console.log('📝 ProductForm: Datos del producto a guardar:', productData);

      if (product) {
        // Actualizar producto existente
        console.log('🔄 ProductForm: Actualizando producto existente...');
        await updateProduct(product.id, productData);
        console.log('✅ ProductForm: Producto actualizado exitosamente');
      } else {
        // Crear nuevo producto
        console.log('➕ ProductForm: Creando nuevo producto...');
        const result = await addProduct(productData);
        console.log('✅ ProductForm: Producto creado exitosamente:', result);
      }

      setLoading(false);
      onClose();
    } catch (error) {
      console.error('❌ ProductForm: Error guardando producto:', error);
      setErrors({ submit: `Error al guardar el producto: ${error.message}` });
      setLoading(false);
    }
  };

  return (
    <>
      <DialogTitle>
        {product ? 'Editar Producto' : 'Nuevo Producto'}
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre del Producto"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={!!errors.name}
                helperText={errors.name}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción"
                name="description"
                value={formData.description}
                onChange={handleChange}
                error={!!errors.description}
                helperText={errors.description}
                multiline
                rows={3}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Precio"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleChange}
                onBlur={handlePriceBlur}
                error={!!errors.price}
                helperText={errors.price}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                inputProps={{ min: 0, step: 0.01 }}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.category} required>
                <InputLabel>Categoría</InputLabel>
                <Select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  label="Categoría"
                >
                  {categories.map(category => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
                {errors.category && (
                  <Box color="error.main" fontSize="0.75rem" mt={0.5} ml={1.75}>
                    {errors.category}
                  </Box>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Stock Inicial"
                name="stock"
                type="number"
                value={formData.stock}
                onChange={handleChange}
                error={!!errors.stock}
                helperText={errors.stock || "Cantidad inicial en inventario"}
                inputProps={{ min: 0 }}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Código de Barras"
                name="barcode"
                value={formData.barcode}
                onChange={handleChange}
                error={!!errors.barcode}
                helperText={errors.barcode || "Código de barras único (opcional)"}
                placeholder="123456789012"
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Imagen del Producto
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                >
                  Subir Imagen
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </Button>
                
                <TextField
                  fullWidth
                  label="O usar URL de imagen"
                  name="image"
                  value={formData.image.startsWith('data:') ? '' : formData.image}
                  onChange={handleChange}
                  error={!!errors.image}
                  helperText={errors.image || "Alternativamente, puedes usar una URL"}
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
              </Box>
            </Grid>

            {(imagePreview || formData.image) && (
              <Grid item xs={12}>
                <Box display="flex" justifyContent="center">
                  <img
                    src={imagePreview || formData.image}
                    alt="Vista previa"
                    style={{
                      maxWidth: '200px',
                      maxHeight: '200px',
                      objectFit: 'cover',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </Box>
              </Grid>
            )}

            {product && (
              <Grid item xs={12}>
                <Alert severity="info">
                  Los cambios en el stock se registrarán como movimiento de inventario.
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading}
          >
            {loading ? 'Guardando...' : (product ? 'Actualizar' : 'Crear')}
          </Button>
        </DialogActions>
      </form>
    </>
  );
}

export default ProductForm;
