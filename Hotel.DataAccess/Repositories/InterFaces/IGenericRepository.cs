using Hotel.DataAccess.Models;
using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Text;

namespace Hotel.DataAccess.Repositories.InterFaces
{  public interface IGenericRepository<TEntity> where TEntity : BaseEntity<int>, new()
        {
            // Get By Id
            Task<TEntity?> GetByIdAsync(int id, CancellationToken ct = default);

            // Add
            void Add(TEntity entity);
            // Update
            void Update(TEntity entity);
            // Delete
            void Delete(TEntity entity);
            // Get All
            Task<IEnumerable<TEntity>> GetAllAsync(bool tracking = false, CancellationToken ct = default);

            // check email , phone
            Task<bool> AnyAsync(Expression<Func<TEntity, bool>> predicate, CancellationToken ct = default);

            // check
            Task<TEntity> FirstOrDefaultAsync(Expression<Func<TEntity, bool>> predicate, bool tracking = false, CancellationToken ct = default);

            Task<int> CountAsync(Expression<Func<TEntity, bool>>? predicate = null, CancellationToken ct = default);

        }
    }

